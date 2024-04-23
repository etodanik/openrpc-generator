#include "Utils.h"

TSharedPtr<FJsonObject> ConvertSnakeCaseToCamelCase(const TSharedPtr<FJsonObject>& OriginalObject)
{
	TSharedPtr<FJsonObject> NewObject = MakeShareable(new FJsonObject);

	for (const auto& Elem : OriginalObject->Values)
	{
		FString Key = Elem.Key;
		FString NewKey = ConvertKeyToCamelCase(Key);

		if (Elem.Value->Type == EJson::Object)
		{
			NewObject->SetObjectField(NewKey, ConvertSnakeCaseToCamelCase(Elem.Value->AsObject()));
		}
		else if (Elem.Value->Type == EJson::Array)
		{
			TArray<TSharedPtr<FJsonValue>> NewArray;
			const TArray<TSharedPtr<FJsonValue>>& Array = Elem.Value->AsArray();
			for (const TSharedPtr<FJsonValue>& Val : Array)
			{
				if (Val->Type == EJson::Object)
				{
					NewArray.Add(MakeShareable(new FJsonValueObject(ConvertSnakeCaseToCamelCase(Val->AsObject()))));
				}
				else
				{
					NewArray.Add(Val);
				}
			}
			NewObject->SetArrayField(NewKey, NewArray);
		}
		else
		{
			NewObject->SetField(NewKey, Elem.Value);
		}
	}

	return NewObject;
}

FString ConvertKeyToCamelCase(const FString& SnakeCaseKey)
{
	FString Result;
	bool bToUpper = false;

	for (int32 Index = 0; Index < SnakeCaseKey.Len(); ++Index)
	{
		const TCHAR Character = SnakeCaseKey[Index];

		if (Character == TEXT('_'))
		{
			bToUpper = true;
			continue;
		}

		if (bToUpper && FChar::IsLower(Character))
		{
			Result.AppendChar(FChar::ToUpper(Character));
			bToUpper = false;
		}
		else
		{
			Result.AppendChar(Character);
		}
	}

	return Result;
}