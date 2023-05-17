/* eslint-disable @typescript-eslint/no-unused-vars */
import * as App from '@zaiusinc/app-sdk';
import {logger, storage} from '@zaiusinc/app-sdk';
import {Credentials, StorageAccountSettings} from '../data/Azure';
import {Azure} from '../lib/Azure/Azure';

export class Lifecycle extends App.Lifecycle {
  public async onInstall(): Promise<App.LifecycleResult> {
    try {
      logger.info('Performing Install');
      // TODO: any operation you need to perform during installation
      return {success: true};
    } catch (error: any) {
      logger.error('Error during installation:', error);
      return {success: false, retryable: true, message: `Error during installation: ${error}`};
    }
  }

  public async onSettingsForm(
    section: string, action: string, formData: App.SubmittedFormData): Promise<App.LifecycleSettingsResult> {
    const result = new App.LifecycleSettingsResult();
    try {
      switch (action) {
      case 'save_credentials':
        logger.info('Validating Credentials');
        const credential = {
          clientId: formData.clientId,
          tenantId: formData.tenantId,
          clientSecret: formData.clientSecret,
          subscriptionId: formData.subscriptionId,
        } as Credentials;

        if (await Azure.validateCredentials(credential)) {
          logger.info('Storing Settings');
          await storage.settings.put('credentials', credential);
          result.addToast('success', 'Credentials have been successfully validated and stored.');
          result.redirectToSettings('settings');
        } else {
          result.addToast(
            'danger',
            'Validation of the provided credentials failed. Check your credentials and try again.'
          );
        }
        break;
      case 'save_settings':
        logger.info('Saving settings and registering Webhook');
        const settings = {
          accountName: formData.accountName,
          resourceGroup: formData.resourceGroup,
          orderContainer: formData.orderContainer,
          offlineStoreContainer: formData.offlineStoreContainer
        } as StorageAccountSettings;

        if (await Azure.installWebhook(settings)) {
          await storage.settings.put('settings', settings);
          result.addToast('success', 'Settings and Webhook have been successfully stored.');
        } else {
          result.addToast('danger', 'Storing of settings and Webhook has failed. Check your settings and try again.');
        }
        break;
      }
      return result;
    } catch (e) {
      logger.error('Error during setup', e);
      return result.addToast('danger', 'Sorry, an unexpected error occurred. Please try again in a moment.');
    }
  }

  public async onAuthorizationRequest(
    section: string, formData: App.SubmittedFormData
  ): Promise<App.LifecycleSettingsResult> {
    const result = new App.LifecycleSettingsResult();
    // TODO: if your application supports the OAuth flow (via oauth_button in the settings form), evaluate the form
    // data and determine where to send the user: `result.redirect('https://<external oauth endpoint>')`
    return result.addToast('danger', 'Sorry, OAuth is not supported.');
  }

  public async onAuthorizationGrant(request: App.Request): Promise<App.AuthorizationGrantResult> {
    // TODO: if your application supports the OAuth flow, evaluate the inbound request and perform any necessary action
    // to retrieve the access token, then forward the user to the next relevant settings form section:
    // `new App.AuthorizationGrantResult('my_next_section')`
    return new App.AuthorizationGrantResult('').addToast('danger', 'Sorry, OAuth is not supported.');
  }

  public async onUpgrade(fromVersion: string): Promise<App.LifecycleResult> {
    // TODO: any logic required when upgrading from a previous version of the app
    // Note: `fromVersion` may not be the most recent version or could be a beta version
    return {success: true};
  }

  public async onFinalizeUpgrade(fromVersion: string): Promise<App.LifecycleResult> {
    // TODO: any logic required when finalizing an upgrade from a previous version
    // At this point, new webhook URLs have been created for any new functions in this version
    return {success: true};
  }

  public async onAfterUpgrade(): Promise<App.LifecycleResult> {
    // TODO: any logic required after the upgrade has been completed.  This is the plugin point
    // for triggering one-time jobs against the upgraded installation
    return {success: true};
  }

  public async onUninstall(): Promise<App.LifecycleResult> {
    // TODO: any logic required to properly uninstall the app
    return {success: true};
  }
}
