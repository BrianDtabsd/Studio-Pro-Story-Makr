import { getApp } from "firebase/app";
import {
  getFunctions,
  httpsCallable,
  type HttpsCallable,
  type HttpsCallableOptions,
} from "firebase/functions";

export const CLOUD_FUNCTIONS_REGION = "us-central1";

const getCloudFunctions = () => getFunctions(getApp(), CLOUD_FUNCTIONS_REGION);

export const makeCallable = <Req, Res>(
  callableName: string,
  options?: HttpsCallableOptions
): HttpsCallable<Req, Res> =>
  httpsCallable<Req, Res>(getCloudFunctions(), callableName, options);
