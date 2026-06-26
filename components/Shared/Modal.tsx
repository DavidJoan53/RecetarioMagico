import {View, Modal as ReactNativeModal, Pressable, Text} from 'react-native'

interface ModalInterface {
  children: any
  footer?: any
  open: boolean
  onClose: () => void
  onFinish: () => void
}

const Modal = ({
  children,
  footer,
  open,
  onClose = () => {},
  onFinish = () => {},
}: ModalInterface) => {
  // const ModalFooter = () => {
  //   return (
  //     <View className="flex flex-row gap-4 bg-red-100">
  //       <Pressable onPress={onClose}><Text>Close</Text></Pressable>
  //       <Pressable onPress={onFinish}><Text>Confirm</Text></Pressable>
  //     </View>
  //   )
  // }
  return (
    <ReactNativeModal
      // animationType="slide"
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
        {children}
        {/* {footer || <ModalFooter/>} */}
      </View>
    </ReactNativeModal>
  )
}

export default Modal
