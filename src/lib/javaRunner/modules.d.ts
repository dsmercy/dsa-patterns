declare module "*.js?worker" {
  const WorkerCtor: new () => Worker;
  export default WorkerCtor;
}
declare module "./transpile.js" {
  export function transpile(src: string): { js: string; methods: string[] };
  export function warnings(src: string): string[];
}
