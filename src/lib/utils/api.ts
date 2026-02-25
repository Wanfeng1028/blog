import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  message: string;
  code?: string;
};

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json<ApiFailure>({ ok: false, message, code }, { status });
}
