import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createOptimizedTreeStructure, SortableTree } from "./index";
import { getItemById } from "./SortableTree/utilities";

const App = () => {
	const [treeStructure, setTreeStructure] = useState(
		createOptimizedTreeStructure([
			{ id: "1", label: "Hello", children: [] },
			{
				id: "2",
				label: "World",
				children: [{ id: "2.2", label: "Hello world!", children: [] }],
			},
		])
	);

	useEffect(() => {
		console.log(getItemById(treeStructure, "2"));
	}, [treeStructure]);

	return (
		<SortableTree
			items={treeStructure.items}
			onItemsChange={setTreeStructure}
			isRemovable
			allowNestedItemAddition
			showDropIndicator
		></SortableTree>
	);
};

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
