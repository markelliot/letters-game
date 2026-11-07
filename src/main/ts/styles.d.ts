declare module "*.scss";
declare module "*.css";
declare module "*.txt" {
    const url: string;
    export default url;
}
