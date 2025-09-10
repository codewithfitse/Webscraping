import { useState, useEffect } from 'react';
import {apiUrl} from "./apiUrl";

export const useGetUserInfo = (ludo4Token) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ludo4Token) {
      fetch(`${apiUrl}/api/userinfo/profile`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${ludo4Token}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Invalid ludo4Token or failed to authenticate");
          }
          return response.json();
        })
        .then((response) => {
          const data = response.userData; 
          console.log("data", data)
          const userInfoData = {
            session: data.session,
            username: data.username,
            balance: Math.floor(data.balance),
            id: data.chatId,
            chatId: data.chatId,
          }
          setUserInfo(userInfoData);  
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          setError(error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [ludo4Token]);

  return { userInfo, isLoading, error };
};
