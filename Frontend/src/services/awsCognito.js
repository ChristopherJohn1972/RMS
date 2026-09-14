import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const POOL_DATA = {
  UserPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '',
};

const userPool = POOL_DATA.UserPoolId
  ? new CognitoUserPool(POOL_DATA)
  : null;

export const signUp = (email, password, attributes = {}) => {
  if (!userPool) {
    return Promise.reject(new Error('Cognito not configured'));
  }

  return new Promise((resolve, reject) => {
    const attrList = Object.entries(attributes).map(
      ([key, value]) => ({ Name: key, Value: value })
    );

    userPool.signUp(email, password, attrList, null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

export const signIn = (email, password) => {
  if (!userPool) {
    return Promise.reject(new Error('Cognito not configured'));
  }

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => resolve({
        accessToken: result.getAccessToken().getJwtToken(),
        idToken: result.getIdToken().getJwtToken(),
        refreshToken: result.getRefreshToken().getToken(),
      }),
      onFailure: (err) => reject(err),
    });
  });
};

export const signOut = () => {
  const user = userPool?.getCurrentUser();
  if (user) user.signOut();
};

export const getCurrentUser = () => {
  if (!userPool) return null;
  return userPool.getCurrentUser();
};

export const getSession = () => {
  const user = getCurrentUser();
  if (!user) return Promise.reject(new Error('No user'));

  return new Promise((resolve, reject) => {
    user.getSession((err, session) => {
      if (err) reject(err);
      else resolve(session);
    });
  });
};

export const forgotPassword = (email) => {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'));

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess: (data) => resolve(data),
      onFailure: (err) => reject(err),
    });
  });
};

export const confirmNewPassword = (email, code, newPassword) => {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'));

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
};
