// Copyright by André van Kammen
// Licensed under CC BY-NC-SA
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { IDB, idb } from "../../KMN-utils-browser/indexed-db.js";
import defer from "../../KMN-utils.js/defer.js";
import { RecordVar } from "../../KMN-varstack.js/structures/record.js";
import { ArrayTableVar, TableVar } from "../../KMN-varstack.js/structures/table.js";
import { BlobBaseVar } from "../../KMN-varstack.js/vars/blob-base.js";
import { Types } from "../../KMN-varstack.js/varstack.js";

const tableMetaStore = 'table-meta-data';

Types.addRecord('TableMetaData', {
  name: 'String:key',
  count: 'Int:value'
})

const tableExtention = '-table';

class IndexedDBBlobBinding {
  /**
   *
   * @param {BlobBaseVar} blobVar
   * @param {IDB} idb
   * @param {string} baseStorageName
   * @param {string} fieldName
   * @param {string} keyValue
   */
  constructor (blobVar, idb, baseStorageName, fieldName, keyValue) {
    this.storageName = baseStorageName + '-' + fieldName;
    this.blobVar = blobVar;
    this.idb = idb;
    this.keyName = keyValue;

    // TODO: loadcallback event handler
    this.blobVar._loadCallback = this.handleBlobLoad.bind(this);
    this.blobEvent = this.blobVar.$addEvent(this.handleChanged.bind(this))
  }

  handleChanged () {
    if (this.blobVar.$v) {
      this.idb.setStoreValue(this.storageName, this.keyName, this.blobVar.$v);
    }
  }

  async handleBlobLoad () {
    let result = await this.idb.getStoreValue(this.storageName, this.keyName);
    return result;
  }

  async remove() {
    return await this.idb.deleteStoreValue(this.storageName, this.keyName);
  }

  dispose() {
    if (this.blobEvent) {
      this.blobVar.$removeEvent(this.blobEvent);
    }
  }
}

class IndexedDBRecordBindingBase {
  /**
   *
   * @param {RecordVar} varToStore
   * @param {IDB} idb
   * @param {string} baseStorageName
   * @param {string} keyValue
   * @param {boolean} doGet
   */
  constructor(varToStore, idb, baseStorageName, keyValue, doGet = true) {
    this.varToStore = varToStore;
    this.storageName = baseStorageName + tableExtention;
    this.idb = idb;
    let justCreated = true;
    this.keyName = keyValue;
    this.blobStores = [];
    this.varToStore.$linkBlobFields((name, v) => {
      this.blobStores.push(new IndexedDBBlobBinding(v, idb, baseStorageName, name, keyValue));
    });
    if (doGet) {
      this.idb.getStoreValue(this.storageName, this.keyName).then(
        (result) => {
          if (result != null) {
            this.varToStore.$v = result;
            justCreated = false;
          }
        }).finally(() => {
          defer(() => {
            this.varToStore.$addEvent(this.handleChanged.bind(this))
            if (justCreated) {
              this.handleChanged();
            }
          });
        });
    } else {
      this.varToStore.$addEvent(this.handleChanged.bind(this))
    }
    this.updateSceduled = false;
  }

  handleChanged() {
    // Debounce using a timer of 0 so  it fires once after a blovk of changes
    if (!this.updateSceduled) {
      this.updateSceduled = true;
      defer(async () => {
        try {
          this.updateSceduled = false;
          this.varToStore.$storeIsPending();
          const obj = this.varToStore.toObject();
          const result = await this.idb.setStoreValue(this.storageName, this.keyName, obj);
        } finally {
          this.varToStore.$storeIsFinished();
        }
      });
    }
  }

  async remove() {
    for (let store of this.blobStores) {
      return await store.remove();
    }
  }

  dispose() {
    for (let store of this.blobStores) {
      store.dispose();
    }
  }
}

export class IndexedDBRecordBinding extends IndexedDBRecordBindingBase {
  /**
   *
   * @param {RecordVar} varToStore
   * @param {IDB} idb
   * @param {string} baseStorageName
   */
  constructor(varToStore, idb, baseStorageName) {
    const keyFieldName = varToStore.$keyFieldName;
    const keyFieldVar = varToStore.$v[keyFieldName];
    super (varToStore, idb, baseStorageName, keyFieldVar.$v);
  }
}

export class IndexedDBTableBinding {
  /**
   * Creates a link between a varstack table and a indexed-db store
   * @param {ArrayTableVar} tableToStore
   * @param {IDB} idb
   * @param {string} baseStorageName
   * @param {any} defaultData
   * @param {string} prependKey
   * @param {boolean} preLoadData
   */
  constructor(tableToStore, idb, baseStorageName, defaultData, prependKey = '', preLoadData = true) {
    this.tableToStore = tableToStore;
    this.storageName = baseStorageName;
    this.tableStorageName = baseStorageName + tableExtention;
    this.justCreated = true;
    this.idb = idb;
    this.idb.registerStoreName(tableMetaStore);
    this.idb.registerStoreName(this.tableStorageName);
    for (const fieldDef of this.tableToStore.elementType.prototype._fieldDefs) {
      if (Types[fieldDef.type].isBlob) {
        this.idb.registerStoreName(baseStorageName + '-' + fieldDef.name);
      }
    }
    this.tableMeta = new Types.TableMetaData();
    this.tableMeta.name.$v = baseStorageName;
    this.tableMeta.count.$v = defaultData?.length || 0;
    this.tableMetaBinding = new IndexedDBRecordBinding(this.tableMeta, this.idb, tableMetaStore);
    /** @type {Record<string,IndexedDBRecordBindingBase>} */
    this.boundRecords = {};
    this.isLoaded = false;
    this.justCreated = false;
    this.keyFieldName = this.tableToStore.keyFieldName;
    this.prependKey = prependKey;
    this.tableToStore.onFindKeyAsync = this.findKeyAsync.bind(this);
    this.tableToStore.onRemoveFromStore = this.removeRecordAsync.bind(this)

    const loadingFinished = () => {
      this.tableToStore.addArrayChangeEvent(this.handleArrayChanged.bind(this));
      if ((this.tableToStore.length === 0) && defaultData) {
        this.tableToStore.$v = defaultData;
      }
      this.handleArrayChanged();
      this.isLoaded = true;
    };

    if (preLoadData) {
      let getQuery = prependKey
        ? this.idb.getAllStartingWith(prependKey, this.tableStorageName)
        : this.idb.getAll(this.tableStorageName);
      getQuery.then((result) => {
        if (result) {
          this.justCreated = false;
          try {
            this.tableToStore.$beginLoading();
            for (let entry of result) {
              let el = this.tableToStore.add(entry);
              this.checkBinding(el, false);
            }
          } finally {
            this.tableToStore.$endLoading();
          }
        }
      }).finally(loadingFinished);
    } else {
      loadingFinished();
    }
  }

  async findKeyAsync(keyValue) {
    let result = await this.idb.getStoreValue(this.tableStorageName, keyValue);
    if (result) {
      let el = this.tableToStore.find(this.keyFieldName, keyValue);
      this.tableToStore.$beginLoading();
      try {
        if (el) {
          el.$v = result;
        } else {
          if (result[this.keyFieldName] === keyValue) {
            el = this.tableToStore.add(result);
          }
        }
        if (el) {
          if (el[this.keyFieldName].$v !== keyValue) {
            el[this.keyFieldName].$v = keyValue;
            console.error('Incorrect dabase key restored ', el.toObject())
          }
          this.checkBinding(el, false);
        }
      } finally {
        this.tableToStore.$endLoading();
      }
      return el;
    } else {
      return null;
    }
  }

  async removeRecordAsync(record) {
    // TODO DELETE FROM DATABASE
    let keyValue = this.prependKey + record[this.keyFieldName].$v;
    let binding = this.boundRecords[keyValue];
    if (binding) {
      await binding.remove();
      binding.dispose();
    }
    await this.idb.deleteStoreValue(this.tableStorageName, keyValue);
    // if (!binding) {
    //   this.boundRecords[keyValue] = new IndexedDBRecordBindingBase(el, this.idb, this.storageName, keyValue, doGet);
    // }
    // let el = this.tableToStore.remove(record);
    // this.checkBinding(el, false);
    // return el;
  }

  async loadKeysStartingWith(keyValue) {
    await this.idb.getAllStartingWith(this.tableStorageName, keyValue).then((result) => {
      if (result) {
        try {
          this.tableToStore.$beginLoading();
          for (let entry of result) {
            let el = this.tableToStore.add(entry);
            this.checkBinding(el, false);
          }
        } finally {
          this.tableToStore.$endLoading();
        }
      }
    });
  }

  checkBinding(el, doGet) {
    let keyValue = this.prependKey + el[this.keyFieldName].$v;
    let binding = this.boundRecords[keyValue];
    if (!binding) {
      this.boundRecords[keyValue] = new IndexedDBRecordBindingBase(el, this.idb, this.storageName, keyValue, doGet);
    }
  }

  handleArrayChanged() {
    this.tableMeta.count.$v = this.tableToStore.length;
    for (let ix = 0; ix < this.tableToStore.length; ix++) {
      let el = this.tableToStore.element(ix);
      if (el) {
        this.checkBinding(el, false);
      }
    }
  }

  // handleChanged() {
  //   if (this.storageName) {
  //     let storeStr = JSON.stringify(this.varToStore);
  //     let start = performance.now();
  //     localStorage.setItem(this.storageName, storeStr);
  //     let stop = performance.now();
  //     console.log('Update to local storage: ',storeStr.length,'bytes ',(stop-start).toFixed(2));
  //   }
  // }
}

export default IndexedDBTableBinding