import DynamicForm from "./DynamicForm";
import DynamicTable from "./DynamicTable";
import CsvImport from "./CsvImport";

export default function Renderer({ uiConfig, schema, modelName, refreshKey, onCreated, onError }) {
  const items = Array.isArray(uiConfig) ? uiConfig : [];

  const formItem = items.find(i => i?.type === 'form');
  const tableItem = items.find(i => i?.type === 'table');
  const csvItem = items.find(i => i?.type === 'csvImport');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formItem && (
          <DynamicForm
            key={formItem.key || 'form'}
            schema={schema}
            modelName={modelName}
            onCreated={onCreated}
            onError={onError}
          />
        )}
        {tableItem && (
          <DynamicTable
            key={tableItem.key || 'table'}
            schema={schema}
            modelName={modelName}
            refreshKey={refreshKey}
            onError={onError}
          />
        )}
      </div>
      {csvItem && (
        <div className="w-full">
          <CsvImport
            key={csvItem.key || 'csv'}
            schema={schema}
            modelName={modelName}
            onError={onError}
          />
        </div>
      )}
    </div>
  );
}
