const KEY_B64 = Deno.env.get("TOKEN_ENC_KEY")!;

async function getKey(): Promise<CryptoKey> {
    const raw = Uint8Array.from(atob(KEY_B64), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string): Promise<string> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherText = await crypto.subtle.encrypt(
        {name: "AES-GCM", iv},
        key,
        new TextEncoder().encode(plaintext),
    );
    const combined = new Uint8Array(iv.length + cipherText.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherText), iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decrypt(payload: string): Promise<string> {
    const key = await getKey();
    const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipherText = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({name: "AES-GCM", iv}, key, cipherText);
    return new TextDecoder().decode(plaintext);
}