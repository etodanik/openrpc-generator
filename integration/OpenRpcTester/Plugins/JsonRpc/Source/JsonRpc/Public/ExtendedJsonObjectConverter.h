#pragma once

#include "JsonObjectConverter.h"

class FExtendedJsonObjectConverter : public FJsonObjectConverter
{
public:
	static TSharedPtr<FJsonValue> UPropertyToJsonValue(FProperty* Property, const void* Value, int64 CheckFlags = 0,
	                                                   int64 SkipFlags = 0,
	                                                   const CustomExportCallback* ExportCb = nullptr,
	                                                   FProperty* OuterProperty = nullptr,
	                                                   EJsonObjectConversionFlags ConversionFlags =
		                                                   EJsonObjectConversionFlags::None);
};
