export function showMessage(title, copy) { const dialog = document.querySelector('#message-dialog'); document.querySelector('#message-title').textContent = title; document.querySelector('#message-copy').textContent = copy; dialog.showModal(); }
export function openDialog(selector) { const dialog = document.querySelector(selector); if (!dialog.open) dialog.showModal(); }
export function closeDialog(selector) { const dialog = document.querySelector(selector); if (dialog.open) dialog.close(); }
