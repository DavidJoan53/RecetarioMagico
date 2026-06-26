import {ScrollView, Text, View} from 'react-native'
import FoodCard from './FoodCard'
import {FoodCardInterface} from './FoodCard'

interface FoodCardsCarrouselInterface {
  title: string
  items: FoodCardInterface[]
}

const FoodCardsCarrousel = ({
  title = '',
  items = [],
}: FoodCardsCarrouselInterface) => {
  return (
    <View>
      <Text className="text-xl font-bold">{title}</Text>
      <ScrollView horizontal={true}>
        {items.map(item => (
          <FoodCard key={item.id} {...item} />
        ))}
      </ScrollView>
    </View>
  )
}

export default FoodCardsCarrousel
