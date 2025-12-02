declare module "web-push" {
  const webpush: {
    setVapidDetails(
      subject: string,
      publicKey: string,
      privateKey: string
    ): void;
    sendNotification(
      subscription: any,
      payload?: string | Buffer,
      options?: any
    ): Promise<any>;
  };
  export default webpush;
}
