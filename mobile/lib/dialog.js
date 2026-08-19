import { Platform, Alert } from "react-native";

export function notify(title, message){
    if(Platform.OS === 'web'){
        window.alert(message ? `${title}\n\n${message}`: title);
    }
    else{
        Alert.alert(title, message);
    }
}

export function confirmAction(title, message, onConfirm, confirmLabel = 'OK'){
    if(Platform.OS === 'web'){
        if(window.confirm(message ? `${title}\n\n${message}` : title)){
            onConfirm();
        }
    }
    else{
        Alert.alert(title, message, [
            {text: 'Cancel', style: 'cancel'},
            {text: confirmLabel, style: 'destructive', onPress: onConfirm},
        ]);
    }
}