#pragma once

#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "TransportInterface.generated.h"

UINTERFACE()
class JSONRPC_API UTransportInterface : public UInterface
{
	GENERATED_BODY()
};

class JSONRPC_API ITransportInterface
{
	GENERATED_BODY()

public:
	virtual void SendMessage(const FString& Message, const TFunction<void(const FString&)>& OnResponseReceived) = 0;
};
