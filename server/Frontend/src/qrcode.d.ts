declare module "qrcode" {
  export type QRCodeErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  export type QRCodeColor = {
    dark?: string;
    light?: string;
  };

  export type QRCodeToDataURLOptions = {
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    margin?: number;
    width?: number;
    color?: QRCodeColor;
  };

  const QRCode: {
    toDataURL(
      text: string,
      options?: QRCodeToDataURLOptions,
    ): Promise<string>;
  };

  export default QRCode;
}
