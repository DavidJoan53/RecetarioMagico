import {ScrollView, Text} from 'react-native'
import {useTranslation} from 'react-i18next'

const CreateScreen = () => {
  const {t} = useTranslation()

  return (
    <ScrollView>
      <Text>{t('screens.create')}</Text>
    </ScrollView>
  )
}

export default CreateScreen
