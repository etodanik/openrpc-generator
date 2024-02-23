#pragma once

#include "CoreMinimal.h"
#include "TransportInterface.h"
#include "JsonRpcClient.generated.h"

UCLASS(Blueprintable, BlueprintType)
class JSONRPC_API UJsonRpcClient : public UObject
{
	GENERATED_BODY()

public:
	UJsonRpcClient();

	UFUNCTION(BlueprintCallable)
	void Initialize(TScriptInterface<ITransportInterface> InTransport);
	void SendRequest(FString& MethodName, const TSharedPtr<FJsonObject>& ParamsObj,
	                 const TFunction<void(const TSharedPtr<FJsonObject>&)>& OnResponse);

private:
	TScriptInterface<ITransportInterface> Transport;
	TArray<TSharedPtr<FJsonValue>> JsonObjectToPositionalArray(const TSharedPtr<FJsonObject>& ParamsObj);
};
