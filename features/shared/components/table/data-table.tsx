import { Loading } from '@/components/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, MouseSensor, TouchSensor, UniqueIdentifier, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { flexRender, Table as TanstackTable } from '@tanstack/react-table';
import { useId, useMemo } from 'react';
import { DraggableTableRow } from './draggable-table-row';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';


interface DataTableProps<TData> {
    table: TanstackTable<TData>;
    columnsLength: number;
    loading?: boolean;
    getRowId?: (row: TData) => UniqueIdentifier;
    onReorder?: (activeId: UniqueIdentifier, overId: UniqueIdentifier) => void;
    emptyMessage?: React.ReactNode;
}

export function DataTable<TData>({
    table,
    columnsLength,
    loading,
    getRowId,
    onReorder,
    emptyMessage = 'No results found'
}: DataTableProps<TData>) {
    const sortableId = useId()

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const dataIds = useMemo<UniqueIdentifier[]>(() => {
        if (!getRowId || !onReorder) return []

        return table.getRowModel().rows.map(row => getRowId(row.original))
    }, [table, getRowId, onReorder])

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (active && over && active.id !== over.id && onReorder) {
            onReorder(active.id, over.id)
        }
    }

    if (loading) return <Loading />


    const tableContent = (
        <Table>
            <TableHeader className='bg-muted sticky top-0 z-10'>
                {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                                {header.isPlaceholder ? null : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows.length ? (
                    onReorder ? (
                        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                            {table.getRowModel().rows.map(row => (
                                <DraggableTableRow key={row.id} row={row} enableDragAndDrop={true} />
                            ))}
                        </SortableContext>
                    ) : (
                        table.getRowModel().rows.map(row => (
                            <DraggableTableRow key={row.id} row={row} enableDragAndDrop={false} />
                        ))
                    )
                ) : (
                    <TableRow>
                        <TableCell colSpan={columnsLength} className="h-24 text-center">
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                )}

            </TableBody>
        </Table>
    )

    return (
        <div className="overflow-hidden rounded-lg border">
            {onReorder ? (
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}
                >
                    {tableContent}
                </DndContext>
            ) : (
                tableContent
            )}
        </div>
    );
}   