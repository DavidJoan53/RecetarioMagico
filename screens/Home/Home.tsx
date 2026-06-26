import {FlatList, View} from 'react-native'
// @Components
import GroupCard from '@/components/Groups/GroupCard'
import NewGroupModal from '@/components/Groups/NewGroupModal'
import FoodCardsCarrousel from '@/components/FoodCardsCarrousel/FoodCardsCarrousel'
// @Redux
import {useDispatch} from 'react-redux'
import {setIsNewGroupOpen} from '@/redux/slices/navigation'
// @i18n
import {useTranslation} from 'react-i18next'
// @Mocks
import {
  breakfastRecipes,
  lunchRecipes,
  dinnerRecipes,
  defaultGroups,
} from './Home.mocks'

const HomeScreen = ({navigation}) => {
  const dispatch = useDispatch()
  const {t} = useTranslation()

  return (
    <View
      className="h-screen mx-4 pt-4"
      style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
      <FoodCardsCarrousel
        title={t('sections.breakfast')}
        items={breakfastRecipes}
      />
      <FoodCardsCarrousel title={t('sections.lunch')} items={lunchRecipes} />
      <FoodCardsCarrousel title={t('sections.dinner')} items={dinnerRecipes} />

      <FlatList
        numColumns={2}
        data={defaultGroups}
        columnWrapperStyle={{gap: 10}}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const handleTouch =
            item.id === 'newGroup'
              ? () => dispatch(setIsNewGroupOpen(true))
              : () => navigation.navigate(`/groups/${item.id}`)
          return (
            <GroupCard
              {...item}
              name={t(`groups.${item.id}`)}
              handleTouch={handleTouch}
            />
          )
        }}
      />

      <NewGroupModal />
    </View>
  )
}

export default HomeScreen
