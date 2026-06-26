import {View, Text, TextInput, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {faSliders, faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons'
import {useTranslation} from 'react-i18next'
import {tailwindColors} from '@/utils/colors'

const styles = StyleSheet.create({
  text: {
    color: 'red',
    fontFamily: 'Montserrat',
  },
})

const SearchBar = () => {
  const {t} = useTranslation()

  return (
    <View className="max-h-16 h-full bg-primary flex flex-row items-center">
      <View className="h-12 w-full my-auto px-3 bg-background flex flex-row items-center justify-between rounded-2xl">
        <FontAwesomeIcon
          icon={faSliders}
          size={20}
          color={tailwindColors.secondary.DEFAULT}
        />
        <TextInput
          className="mx-2 flex-1 text-secondary"
          placeholder={t('search.placeholder')}
        />
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          size={20}
          color={tailwindColors.secondary.DEFAULT}
        />
      </View>
    </View>
  )
}

export default SearchBar
