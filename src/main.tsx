import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createOptimizedTreeStructure, SortableTree,} from './index'

const App = () => {
	const [treeStructure, setTreeStructure] = useState(createOptimizedTreeStructure([{ id: "1", label: "Hello", children: [] }, { id: "2", label: "World", children: [] }]))
	return <SortableTree items={treeStructure.items} onItemsChange={setTreeStructure} isRemovable allowNestedItemAddition showDropIndicator></SortableTree>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
)
