export interface ApiErrorDetail {
  message?: string;
  path?: Array<string | number>;
}

function formatApiErrorDetails(details?: ApiErrorDetail[]): string | null {
  if (!details?.length) {
    return null;
  }

  const formattedDetails = details
    .map((detail) => {
      if (!detail?.message) {
        return null;
      }

      return detail.message;
    })
    .filter((detail): detail is string => Boolean(detail));

  if (!formattedDetails.length) {
    return null;
  }

  return Array.from(new Set(formattedDetails)).join("; ");
}

function buildApiErrorMessage(message: string, details?: ApiErrorDetail[]) {
  const formattedDetails = formatApiErrorDetails(details);

  if (!formattedDetails) {
    return message;
  }

  return `${message}: ${formattedDetails}`;
}

function getApiErrorDetails(data: unknown): ApiErrorDetail[] | undefined {
  if (!data || typeof data !== "object" || !("details" in data)) {
    return undefined;
  }

  return Array.isArray(data.details)
    ? (data.details as ApiErrorDetail[])
    : undefined;
}

function getApiErrorMessage(data: unknown, fallbackMessage: string) {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return fallbackMessage;
  }

  return typeof data.error === "string" ? data.error : fallbackMessage;
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetail[];
  baseMessage: string;

  constructor(message: string, status: number, details?: ApiErrorDetail[]) {
    super(buildApiErrorMessage(message, details));
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.baseMessage = message;
  }

  static fromResponse(
    data: unknown,
    fallbackMessage: string,
    status: number
  ): ApiError {
    return new ApiError(
      getApiErrorMessage(data, fallbackMessage),
      status,
      getApiErrorDetails(data)
    );
  }
}
