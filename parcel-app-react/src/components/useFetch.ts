export function getCookie(name: string): string | null {
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export async function UseFetch(url: string, meth: string, bod?: any): Promise<any> {
    const csrftoken = getCookie('csrftoken');

    const res = await fetch(url, {
        method: meth,
        mode: 'cors',
        headers: {
            // when sending FormData, do not set Content-Type
            'X-CSRFToken': csrftoken ?? '',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: bod
    });

    const data = await res.json();
    return data;
}

export async function UseFetchJSON<T = any>(url: string, meth: string, bod?: any): Promise<T> {
    const csrftoken = getCookie('csrftoken');

    const res = await fetch(url, {
        method: meth,
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': csrftoken ?? '',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: bod !== undefined ? JSON.stringify(bod) : undefined
    });

    const data = await res.json();
    return data as T;
}

export default UseFetchJSON;
