import React, { useState } from "react";

const initialData = [
    {
        id: "electronics",
        label: "Electronics",
        value: 1500,
        children: [
            { id: "phones", label: "Phones", value: 800 },
            { id: "laptops", label: "Laptops", value: 700 }
        ]
    },
    {
        id: "furniture",
        label: "Furniture",
        value: 1000,
        children: [
            { id: "tables", label: "Tables", value: 300 },
            { id: "chairs", label: "Chairs", value: 700 }
        ]
    }
];

const HierarchicalTable = () => {

    const [data, setData] = useState(initialData);
    const [inputValues, setInputValues] = useState({});
    const [originalData] = useState(JSON.parse(JSON.stringify(initialData)));
    const calculateParentValues = (items) => {
        return items.map(item => {
            if (item.children) {
                const updatedChildren = calculateParentValues(item.children);
                const newValue = updatedChildren.reduce((sum, child) => sum + child.value, 0);
                return { ...item, value: newValue, children: updatedChildren };
            }
            return item;
        });
    };

    const updateVariance = (items, originalItems) => {
        const findOriginalItem = (list, id) => {
            for (const entry of list) {
                if (entry.id === id) return entry;
                if (entry.children) {
                    const found = findOriginalItem(entry.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        return items.map(item => {
            const originalItem = findOriginalItem(originalItems, item.id);
            const originalValue = originalItem ? originalItem.value : item.value;
            const varianceValue = ((item.value - originalValue) / originalValue * 100).toFixed(2) + "%";

            let updatedItem = { ...item, variance: varianceValue };
            if (item.children) {
                updatedItem.children = updateVariance(item.children, originalItems);
            }
            return updatedItem;
        });
    };

    const allocateNewValues = (parent, newParentValue) => {
        if (!parent.children) return parent;
        const originalTotal = parent.children.reduce((sum, child) => sum + child.value, 0);
        if (originalTotal === 0) return parent;
        const updatedChildren = parent.children.map(child => {
            const contribution = child.value / originalTotal;
            return { ...child, value: newParentValue * contribution };
        });
        return { ...parent, children: updatedChildren };
    };

    const handleUpdate = (id, type) => {
        setData(prevData => {
            const updateValues = (items) => {
                return items.map(item => {
                    if (item.id === id) {
                        const originalItem = originalData.find(orig => orig.id === id);
                        const originalValue = originalItem ? originalItem.value : item.value;
                        let newValue = originalValue;

                        if (type === "percentage") {
                            newValue = originalValue + (originalValue * (inputValues[id] || 0) / 100);
                        } else if (type === "direct") {
                            newValue = inputValues[id] || originalValue;
                        }

                        const updatedItem = allocateNewValues(item, newValue);
                        return { ...updatedItem, value: newValue };
                    }
                    if (item.children) {
                        return { ...item, children: updateValues(item.children) };
                    }
                    return item;
                });
            };
            let updatedData = updateValues(prevData);
            updatedData = calculateParentValues(updatedData);
            updatedData = updateVariance(updatedData, originalData);
            return updatedData;
        });
    };

    const renderRows = (items, level = 0) => {
        return items.map(item => (
            <React.Fragment key={item.id}>
                <tr>
                    <td style={{ paddingLeft: `${level * 20}px` }}>{item.label}</td>
                    <td>{item.value.toFixed(2)}</td>
                    <td>
                        <input
                            type="number"
                            value={inputValues[item.id] || ""}
                            onChange={(e) => setInputValues({ ...inputValues, [item.id]: parseFloat(e.target.value) })}
                        />
                    </td>
                    <td>
                        <button onClick={() => handleUpdate(item.id, "percentage")}>%</button>
                        <button onClick={() => handleUpdate(item.id, "direct")}>Val</button>
                    </td>
                    <td>{item.variance || "0%"}</td>
                </tr>
                {item.children && renderRows(item.children, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <table border="1" cellPadding="5">
            <thead>
                <tr>
                    <th>Label</th>
                    <th>Value</th>
                    <th>Input</th>
                    <th>Actions</th>
                    <th>Variance %</th>
                </tr>
            </thead>
            <tbody>
                {renderRows(data)}
            </tbody>
        </table>
    );
};

export default HierarchicalTable;