import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  roomId: string;
  createdAt: string;
}

interface ChatState {
  messages: Message[];
  activeRoom: string | null;
}

const initialState: ChatState = {
  messages: [],
  activeRoom: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<string>) => {
      state.activeRoom = action.payload;
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },

    clearChat: (state) => {
      state.messages = [];
    },
  },
});

export const { setRoom, addMessage, clearChat } = chatSlice.actions;

export default chatSlice.reducer;