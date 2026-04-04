import axiosInstance from '../utils/axiosConfig';

// Custom hook to use configured axios instance
export const useAxios = () => {
  return axiosInstance;
};

export default useAxios;