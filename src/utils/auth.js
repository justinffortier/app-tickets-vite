import 'firebase/compat/auth';
import firebase from 'firebase/compat/app';
import { $auth, $global, $user } from '@src/signals';
import { getAuthForTenant } from '@src/utils/firebase';
import UsersApi from '@src/api/users.api';

const tenantId = import.meta.env.VITE_APP_FIREBASE_TENANT_ID;
const auth = getAuthForTenant(tenantId);

const syncFirebaseUserToSupabase = async (firebaseUser) => {
  try {
    const existingUser = await UsersApi.getByFirebaseUid(firebaseUser.uid);

    if (!existingUser) {
      // Create new user in Supabase
      await UsersApi.create({
        email: firebaseUser.email,
        first_name: firebaseUser.displayName?.split(' ')[0] || null,
        last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || null,
        firebase_uid: firebaseUser.uid,
      });
    }
  } catch (error) {
    console.error('Error syncing Firebase user to Supabase:', error);
  }
};

export const signIn = async (email, password) => {
  // await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  const result = await auth.signInWithEmailAndPassword(email, password);
  await syncFirebaseUserToSupabase(result.user);
};

export const signInWithGoogle = async () => {
  const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  await syncFirebaseUserToSupabase(result.user);
};

export const signOut = async () => {
  await auth.signOut();
};

export const createNewUser = async (email, password) => {
  const res = await auth.createUserWithEmailAndPassword(email, password);
  await res.user.sendEmailVerification();
  await syncFirebaseUserToSupabase(res.user);
  return res.user;
};

export const sendPasswordResetEmail = async (email) => {
  await auth.sendPasswordResetEmail(email);
};

export const getFirebaseToken = async () => {
  if (firebase.auth().currentUser) {
    return firebase.auth().currentUser.getIdToken();
  }
  return null;
};

export const currentUser = async () => firebase.auth().currentUser;

const parseSessionPayloadFromUser = (payload) => ({
  authToken: payload.multiFactor.user.accessToken,
});

export const handleFirebaseLogin = async (fbUser) => {
  const { authToken } = parseSessionPayloadFromUser(fbUser);
  if (authToken) {
    $auth.update({ authToken });

    $global.update({
      isSignedIn: true,
    });
  }
};

export const getCurrentAuthenticatedUser = async () => {
  const firebaseUser = await currentUser();
  let user = null;

  if (firebaseUser) {
    // Sync user to Supabase
    await syncFirebaseUserToSupabase(firebaseUser);

    // Get user from Supabase
    user = await UsersApi.getByFirebaseUid(firebaseUser.uid);

    if (user) {
      $user.update(user);
    }
  }
  return user;
};

export const handleFirebaseLogout = () => {
  auth.signOut();
  $auth.reset();
  $global.reset();
  $user.reset();
};
