import {ScrollView, Text} from 'react-native'
import {useTranslation} from 'react-i18next'

const CalendarScreen = () => {
  const {t} = useTranslation()

  return (
    <ScrollView>
      <Text>{t('screens.calendar')}</Text>
    </ScrollView>
  )
}

export default CalendarScreen
