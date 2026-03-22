import {
  collection,
  doc,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Project, UserProfile } from "../types";

export type UserPlan = "free" | "pro";

export interface UserProfileDoc extends Omit<UserProfile, "isPro"> {
  plan?: UserPlan;
}

const userProfileConverter: FirestoreDataConverter<UserProfileDoc> = {
  toFirestore(profile: WithFieldValue<UserProfileDoc>) {
    return profile;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<UserProfileDoc>) {
    return snapshot.data();
  },
};

const projectConverter: FirestoreDataConverter<Project> = {
  toFirestore(project: WithFieldValue<Project>) {
    return project;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<Project>) {
    return snapshot.data();
  },
};

export const userProfileDocRef = (userId: string) =>
  doc(db, "users", userId).withConverter(userProfileConverter);

export const userProjectsCollectionRef = (userId: string) =>
  collection(db, "users", userId, "projects").withConverter(projectConverter);

export const userProjectDocRef = (userId: string, projectId: string) =>
  doc(db, "users", userId, "projects", projectId).withConverter(projectConverter);

export const toUserProfile = (docData: UserProfileDoc): UserProfile => ({
  ...docData,
  isPro: docData.plan === "pro",
});

export const toUserProfileDoc = (profile: UserProfile): UserProfileDoc => {
  const { isPro, ...rest } = profile;
  return {
    ...rest,
    plan: isPro ? "pro" : "free",
  };
};

export const toUserProfileUpdate = (
  updates: Partial<UserProfile>
): PartialWithFieldValue<UserProfileDoc> => {
  const { isPro, ...rest } = updates;
  const profileUpdate: PartialWithFieldValue<UserProfileDoc> = { ...rest };
  if (typeof isPro === "boolean") {
    profileUpdate.plan = isPro ? "pro" : "free";
  }
  return profileUpdate;
};
