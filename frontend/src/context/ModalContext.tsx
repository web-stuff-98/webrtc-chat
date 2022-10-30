import { useReducer, createContext, useContext } from "react";
import type { ReactNode } from "react";

export enum EModalType {
  ViewAttachmentVideo,
  ViewAttachmentImage,
  ViewAttachmentFile,
}

const initialState: State = {
  modalType: EModalType.ViewAttachmentImage,
  url: "",
  showModal: false,
};

const ModalContext = createContext<{
  state: State;
  openAttachment: (key: string, ext: string) => void;
  closeAttachment: () => void;
}>({
  state: initialState,
  openAttachment: () => {},
  closeAttachment: () => {},
});

type State = {
  modalType: EModalType;
  url: string;
  showModal: boolean;
};

const modalReducer = (state: State, action: Partial<State>) => ({
  ...state,
  ...action,
});

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openAttachment = (key: string, ext: string) => {
    let modalType = EModalType.ViewAttachmentFile;
    if (ext === "mp4") modalType = EModalType.ViewAttachmentVideo;
    else if (ext === "jpg" || ext === "jpeg")
      modalType = EModalType.ViewAttachmentImage;
    else modalType = EModalType.ViewAttachmentFile;
    dispatch({
      modalType,
      url: `https://d27jd5hhl2iqqv.cloudfront.net/${key}`,
      showModal:true
    });
  };

  const closeAttachment = () => {
    dispatch({
      showModal: false,
    });
  };

  return (
    <ModalContext.Provider value={{ state, openAttachment, closeAttachment }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
