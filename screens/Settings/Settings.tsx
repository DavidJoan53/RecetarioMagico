import {ScrollView, Text} from 'react-native'
import {useTranslation} from 'react-i18next'

const SettingsScreen = () => {
  const {t} = useTranslation()

  return (
    <ScrollView>
      <Text>{t('screens.settings')}</Text>
    </ScrollView>
  )
}

export default SettingsScreen
