import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createOptimizedTreeStructure, SortableTree,} from './index'

const App = () => {
	const [treeStructure, setTreeStructure] = useState(createOptimizedTreeStructure([{ id: "!", label: "Hello", children: [] }, { id: "w!", label: "Hello", children: [] }]))
	return <SortableTree items={treeStructure.items} onItemsChange={setTreeStructure} isRemovable allowNestedItemAddition showDropIndicator></SortableTree>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
)
