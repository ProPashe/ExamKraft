import {
  InstancePresenceRecordType,
  computed,
  createPresenceStateDerivation,
  createTLStore,
  defaultShapeUtils,
  defaultUserPreferences,
  getUserPreferences,
  setUserPreferences,
  react,
  TLAnyShapeUtilConstructor,
  TLInstancePresence,
  TLRecord,
  TLStoreWithStatus,
} from 'tldraw'
import { useEffect, useMemo, useState } from 'react'
import { YKeyValue } from 'y-utility/y-keyvalue'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as Y from 'yjs'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export function useYjsStore({
  roomId = 'example',
  hostUrl = process.env.NODE_ENV === 'development' ? 'ws://localhost:4444' : 'wss://y-webrtc-signaling-eu.herokuapp.com',
  shapeUtils = [],
}: Partial<{
  hostUrl: string
  roomId: string
  version: number
  shapeUtils: TLAnyShapeUtilConstructor[]
}>) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    })
    return store
  })

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  })

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' })

    const yDoc = new Y.Doc({ gc: true })
    const yArr = yDoc.getArray<{ clientId: number; presence: TLInstancePresence }>('tl_presence')
    const yStore = new YKeyValue(yDoc.getArray('tl_state'))

    // Initialize WebRTC Provider
    const roomName = `tldraw-room-${roomId}`
    const provider = new WebrtcProvider(roomName, yDoc, {
      signaling: [hostUrl],
    })

    // Initialize IndexedDB Persistence
    const indexeddbProvider = new IndexeddbPersistence(roomName, yDoc)

    const unsubs: (() => void)[] = []

    function handleSync() {
      // 1.
      // Connect store to yjs store and vis versa, for both the document and its presence

      /* -------------------- Document -------------------- */

      // Sync store changes to the yjs doc
      unsubs.push(
        store.listen(
          function syncStoreChangesToYjsDoc({ changes }) {
            yDoc.transact(() => {
              Object.values(changes.added).forEach((record) => {
                yStore.set(record.id, record)
              })

              Object.values(changes.updated).forEach(([_, record]) => {
                yStore.set(record.id, record)
              })

              Object.values(changes.removed).forEach((record) => {
                yStore.delete(record.id)
              })
            })
          },
          { source: 'user', scope: 'document' } // only sync user's document changes
        )
      )

      // Sync yjs doc changes to the store
      const handleChange = (
        changes: Map<
          string,
          | { action: 'delete'; oldValue: TLRecord }
          | { action: 'update'; oldValue: TLRecord; newValue: TLRecord }
          | { action: 'add'; newValue: TLRecord }
        >,
        transaction: Y.Transaction
      ) => {
        if (transaction.local) return

        const toRemove: TLRecord['id'][] = []
        const toPut: TLRecord[] = []

        changes.forEach((change, id) => {
          switch (change.action) {
            case 'add':
            case 'update': {
              const record = yStore.get(id)!
              toPut.push(record as TLRecord)
              break
            }
            case 'delete': {
              toRemove.push(id as TLRecord['id'])
              break
            }
          }
        })

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove)
          if (toPut.length) store.put(toPut)
        })
      }

      yStore.on('change', handleChange)
      unsubs.push(() => yStore.off('change', handleChange))

      /* -------------------- Presence -------------------- */

      // Sync the yjs doc changes to the presence
      const clientId = yDoc.clientID
      yArr.observeDeep(() => {
        store.mergeRemoteChanges(() => {
          yArr.forEach((item) => {
            if (item.clientId === clientId) return
            store.put([item.presence])
          })
        })
      })

      // Sync presence to the yjs doc
      const userPreferences = computed<any>('userPreferences', () => {
        const user = getUserPreferences()
        return {
          id: user.id,
          color: user.color ?? defaultUserPreferences.color,
          name: user.name ?? defaultUserPreferences.name,
        }
      })

      const presenceDerivation = createPresenceStateDerivation(
        userPreferences,
        { instanceId: InstancePresenceRecordType.createId(clientId.toString()) }
      )(store)

      // Set our initial presence from the derivation's current value
      yArr.push([
        {
          clientId,
          presence: presenceDerivation.get()!,
        },
      ])

      unsubs.push(
        react('when presence changes', () => {
          const presence = presenceDerivation.get()
          requestAnimationFrame(() => {
            const index = yArr.toArray().findIndex((p) => p.clientId === clientId)
            if (index > -1 && presence) {
              yArr.delete(index, 1)
              yArr.insert(index, [{ clientId, presence }])
            }
          })
        })
      )
    }

    let hasSynced = false
    indexeddbProvider.on('synced', () => {
      if (!hasSynced) {
        hasSynced = true
        handleSync()
        
        // Initialize document if it's empty
        if (yStore.yarray.length === 0) {
           getDoc(doc(db, 'sessions', roomId)).then(snap => {
             const data = snap.data();
             if (data?.boardData) {
                try {
                 store.loadStoreSnapshot(JSON.parse(data.boardData));
               } catch(e) {}
             } else {
               store.clear()
               store.put([
                  {
                     id: 'document:document' as any,
                     typeName: 'document',
                     gridSize: 10,
                     name: '',
                     meta: {}
                  },
                  {
                     id: 'page:page' as any,
                     typeName: 'page',
                     name: 'Page 1',
                     index: 'a1' as any,
                     meta: {}
                  }
               ])
             }
           }).catch(() => {})
        }

        setStoreWithStatus({
          store,
          status: 'synced-remote',
          connectionStatus: 'online',
        })
      }
    })

    // Fallback: Force sync after 2 seconds if IndexedDB is slow or fails
    setTimeout(() => {
      if (!hasSynced) {
        hasSynced = true;
        handleSync();
        setStoreWithStatus({ store, status: 'synced-local' } as any);
      }
    }, 2000);

    // Periodically save to Firestore as backup
    const saveInterval = setInterval(() => {
      try {
        const snapshot = store.getStoreSnapshot()
        if (snapshot) {
          updateDoc(doc(db, 'sessions', roomId), {
            boardData: JSON.stringify(snapshot),
            lastUpdated: new Date()
          }).catch(() => {})
        }
      } catch(e) {}
    }, 15000)

    return () => {
      clearInterval(saveInterval)
      unsubs.forEach((fn) => fn())
      unsubs.length = 0
      provider.destroy()
      indexeddbProvider.destroy()
      yDoc.destroy()
    }
  }, [roomId, store, hostUrl])

  return storeWithStatus
}
