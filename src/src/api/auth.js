// src/api/auth.ts
export async function login(email: string, password: string) {
    const response = await fetch('https://api.lajungle.net/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        throw new Error('Échec de l’authentification');
    }

    const data = await response.json();
    return data.token; // Le token JWT
}

export async function getAuthenticatedUser(token: string) {
    const response = await fetch('https://api.lajungle.net/authenticate/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Impossible de récupérer les données utilisateur');
    }

    return await response.json();
}
