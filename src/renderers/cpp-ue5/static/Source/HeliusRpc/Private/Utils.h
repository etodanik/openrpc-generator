#pragma once

TSharedPtr<FJsonObject> ConvertSnakeCaseToCamelCase(const TSharedPtr<FJsonObject>& OriginalObject);
FString ConvertKeyToCamelCase(const FString& SnakeCaseKey);