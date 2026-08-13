import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 2000;

export const SecureStoreAdapter = {
    async getItem(key) {
        const countStr = await SecureStore.getItemAsync(`${key}.count`);
        if (countStr === null) return null;

        const count = parseInt(countStr, 10);
        let value = '';
        for(let i = 0; i < count; i++){
            const part = await SecureStore.getItemAsync(`${key}.${i}`);
            if (part === null) return null;
            value += part;
        }
        return value
    },

    async setItem(key, value) {
        await this.removeItem(key);

        const parts = [];
        for(let i = 0; i < value.length; i += CHUNK_SIZE){
            parts.push(value.slice(i, i + CHUNK_SIZE));
        }

        for (let i = 0; i < parts.length; i++){
            await SecureStore.setItemAsync(`${key}.${i}`, parts[i]);
        }
        await SecureStore.setItemAsync(`${key}.count`, String(parts.length));
    },

    async removeItem(key){
        const countStr = await SecureStore.getItemAsync(`${key}.count`);
        if(countStr === null) return;

        const count = parseInt(countStr, 10);
        for(let i = 0; i < count; i++){
            await SecureStore.deleteItemAsync(`${key}.${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}.count`);
    },
};