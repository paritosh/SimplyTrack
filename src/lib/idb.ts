
"use client";

import type { Tracker, DataPoint } from '@/types';

const DB_NAME = 'InsightTrackDB';
const DB_VERSION = 2; // Incremented due to schema changes (type, unit, color, isPinned on tracker)
const DB_STORE_TRACKERS = 'trackers';
const DB_STORE_DATA_POINTS = 'dataPoints';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBRequest).error);
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBRequest).result as IDBDatabase;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBRequest).result as IDBDatabase;
      if (!tempDb.objectStoreNames.contains(DB_STORE_TRACKERS)) {
        tempDb.createObjectStore(DB_STORE_TRACKERS, { keyPath: 'id' });
      }
      // If upgrading from a version where DB_STORE_TRACKERS existed but didn't have new fields,
      // no direct schema change is needed for objectStore here unless new indexes are added.
      // Fields like 'type', 'unit', 'color', 'isPinned' are added to the objects themselves.

      if (!tempDb.objectStoreNames.contains(DB_STORE_DATA_POINTS)) {
        const dataPointStore = tempDb.createObjectStore(DB_STORE_DATA_POINTS, { keyPath: 'id' });
        dataPointStore.createIndex('trackerId', 'trackerId', { unique: false });
      }
    };
  });
};

// Tracker Operations
export const getAllTrackers = async (): Promise<Tracker[]> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_TRACKERS, 'readonly');
    const store = transaction.objectStore(DB_STORE_TRACKERS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Tracker[]);
    };
    request.onerror = (event) => {
      console.error("Error fetching all trackers:", (event.target as IDBRequest).error);
      reject("Error fetching trackers");
    };
  });
};

export const getTrackerById = async (id: string): Promise<Tracker | undefined> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_TRACKERS, 'readonly');
    const store = transaction.objectStore(DB_STORE_TRACKERS);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as Tracker | undefined);
    };
    request.onerror = (event) => {
      console.error("Error fetching tracker by ID:", (event.target as IDBRequest).error);
      reject("Error fetching tracker");
    };
  });
};

export const addTracker = async (tracker: Tracker): Promise<IDBValidKey> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_TRACKERS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_TRACKERS);
    const request = store.add(tracker);

    request.onsuccess = () => {
      resolve(request.result as IDBValidKey);
    };
    request.onerror = (event) => {
      console.error("Error adding tracker:", (event.target as IDBRequest).error);
      reject("Error adding tracker");
    };
  });
};

export const updateTracker = async (tracker: Tracker): Promise<IDBValidKey> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_TRACKERS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_TRACKERS);
    const request = store.put(tracker);

    request.onsuccess = () => {
      resolve(request.result as IDBValidKey);
    };
    request.onerror = (event) => {
      console.error("Error updating tracker:", (event.target as IDBRequest).error);
      reject("Error updating tracker");
    };
  });
};

export const deleteTracker = async (id: string): Promise<void> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_TRACKERS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_TRACKERS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error deleting tracker:", (event.target as IDBRequest).error);
      reject("Error deleting tracker");
    };
  });
};

// DataPoint Operations
export const getAllDataPoints = async (): Promise<DataPoint[]> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readonly');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result as DataPoint[]);
    };
    request.onerror = (event) => {
      console.error("Error fetching all data points:", (event.target as IDBRequest).error);
      reject("Error fetching data points");
    };
  });
};


export const getDataPointsByTrackerId = async (trackerId: string): Promise<DataPoint[]> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readonly');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const index = store.index('trackerId');
    const request = index.getAll(trackerId);

    request.onsuccess = () => {
      resolve(request.result as DataPoint[]);
    };
    request.onerror = (event) => {
      console.error("Error fetching data points by trackerId:", (event.target as IDBRequest).error);
      reject("Error fetching data points");
    };
  });
};

export const addDataPoint = async (dataPoint: DataPoint): Promise<IDBValidKey> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const request = store.add(dataPoint);

    request.onsuccess = () => {
      resolve(request.result as IDBValidKey);
    };
    request.onerror = (event) => {
      console.error("Error adding data point:", (event.target as IDBRequest).error);
      reject("Error adding data point");
    };
  });
};

export const updateDataPoint = async (dataPoint: DataPoint): Promise<IDBValidKey> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const request = store.put(dataPoint);

    request.onsuccess = () => {
      resolve(request.result as IDBValidKey);
    };
    request.onerror = (event) => {
      console.error("Error updating data point:", (event.target as IDBRequest).error);
      reject("Error updating data point");
    };
  });
};

export const deleteDataPoint = async (id: string): Promise<void> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error deleting data point:", (event.target as IDBRequest).error);
      reject("Error deleting data point");
    };
  });
};

export const deleteDataPointsByTrackerId = async (trackerId: string): Promise<void> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(DB_STORE_DATA_POINTS, 'readwrite');
    const store = transaction.objectStore(DB_STORE_DATA_POINTS);
    const index = store.index('trackerId');
    const request = index.openCursor(IDBKeyRange.only(trackerId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = (event) => {
      console.error("Error deleting data points by trackerId:", (event.target as IDBRequest).error);
      reject("Error deleting data points");
    };
  });
};
