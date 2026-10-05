/**
 * Polyfill / Monkey-patch para prevenir que Google Translate y traductores automáticos de navegadores
 * rompan el árbol DOM de React.
 * 
 * Explicación del problema:
 * Cuando Google Translate traduce el texto de una página, reemplaza y envuelve los TextNodes en etiquetas <font>.
 * Cuando React intenta reconciliar o re-renderizar componentes mediante insertBefore o removeChild,
 * el nodo de referencia ya no es un hijo directo del nodo padre esperado, lanzando el error fatal:
 * "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
 * 
 * Este parche intercepta de manera segura dichas operaciones evitando el pantallazo blanco.
 */

export function applyTranslateFix() {
    if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
        return;
    }

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
        if (referenceNode && referenceNode.parentNode !== this) {
            // Si el nodo de referencia fue movido por el traductor automático, insertamos al final con seguridad
            return originalInsertBefore.call(this, newNode, null) as T;
        }
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };

    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (child.parentNode !== this) {
            if (child.parentNode) {
                return child.parentNode.removeChild(child) as T;
            }
            return child;
        }
        return originalRemoveChild.call(this, child) as T;
    };
}

// Se ejecuta inmediatamente al importarse
applyTranslateFix();
