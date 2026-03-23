import { getApp } from "firebase/app";
import {
  getFunctions,
  httpsCallable,
  type HttpsCallable,
  type HttpsCallableOptions,
} from "firebase/functions";

export const CLOUD_FUNCTIONS_REGION = "us-central1";

const getCloudFunctions = () => getFunctions(getApp(), CLOUD_FUNCTIONS_REGION);

const normalizeCallableName = (callableName: string): string => {
  const normalized = callableName.trim();
  if (!normalized || normalized.toLowerCase() === "undefined" || normalized.toLowerCase() === "null") {
    throw new Error(`Invalid Cloud Function callable name: "${callableName}". Check STORYMAKR/CHRONOS callable config.`);
  }
  return normalized;
};

export const makeCallable = <Req, Res>(
  callableName: string,
  options?: HttpsCallableOptions
): HttpsCallable<Req, Res> =>
  httpsCallable<Req, Res>(getCloudFunctions(), normalizeCallableName(callableName), options);
