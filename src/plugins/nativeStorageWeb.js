export class NativeStorageWeb {
  async set({ key, value }) {
    window.localStorage.setItem(key, value);
  }

  async get({ key }) {
    return { value: window.localStorage.getItem(key) };
  }

  async remove({ key }) {
    window.localStorage.removeItem(key);
  }
}
