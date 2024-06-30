export class TgComponentsError extends Error {}

export class EventRejectionError extends TgComponentsError {
  public variables: Record<string, string | number | Date>;

  public constructor(
    message: string,
    variables?: Record<string, string | number | Date>
  ) {
    super(message);
    this.variables = variables ?? {};
  }
}

export class TextKeyboardParsingError extends Error {
  constructor(
    public rowIdx: number,
    public colIdx: number,
    public button: string
  ) {
    super(`Malformed '${button}' at ${rowIdx}.${colIdx}`);
  }
}
