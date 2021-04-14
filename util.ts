export function throttle(fn: (...params: any[]) => void, wait: number) {
  var time = Date.now();
  return function (...params: any[]) {
      if ((time + wait - Date.now()) < 0) {
          fn(...params);
          time = Date.now();
      }
  }
}