


import { USER_LOGIN_REQUEST,
USER_LOGIN_FAIL,
USER_LOGIN_SUCCESS,
USER_LOGOUT,
USER_UPDATE_TOKEN
 } from "../constants/userConstants";


export const userLoginReducer = (state = {}, action) => {
    switch (action.type) {
      case USER_LOGIN_REQUEST:
        return { loading: true };
      case USER_LOGIN_SUCCESS:
        return { loading: false, userInfo: action.payload };
      case USER_LOGIN_FAIL:
        return { loading: false, error: action.payload };
      case USER_LOGOUT:
        localStorage.removeItem('userInfo');
        return {};
      case USER_UPDATE_TOKEN:
      case 'userLogin/updateToken':
        return { ...state, userInfo: action.payload };
      default:
        return state;
    }
  };