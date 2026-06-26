import {Text, View} from 'react-native'

import {faCirclePlus} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

const Add = () => {
  return (
    <View className="absolute bottom-0 right-52 z-20">
      <Text>Mondongo</Text>
      <FontAwesomeIcon icon={faCirclePlus} size={24} />
    </View>
  )
}

export default Add
