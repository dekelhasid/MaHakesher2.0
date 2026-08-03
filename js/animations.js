export function shake(element) { element.classList.remove('wrong'); requestAnimationFrame(() => element.classList.add('wrong')); setTimeout(() => element.classList.remove('wrong'), 460); }
export function highlight(element) { element.classList.remove('hinted'); requestAnimationFrame(() => element.classList.add('hinted')); setTimeout(() => element.classList.remove('hinted'), 2350); }
