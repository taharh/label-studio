import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LsPlus, LsCross } from '../../../assets/icons';
import { Button } from '../../../components';
import { Form, Input, Label, Toggle } from '../../../components/Form';
import { modal } from '../../../components/Modal/Modal';
import { Modal, } from '../../../components/Modal/ModalPopup';
import { Space } from '../../../components/Space/Space';
import { Block, Elem } from '../../../utils/bem';
import "./WebhookPage.styl";
import { cloneDeep } from 'lodash';
import { useAPI } from '../../../providers/ApiProvider';
import { Description } from '../../../components/Description/Description';


const WebhookList = ({ onSelectActive, webhooks, fetchWebhooks }) => {
  const showNewWebhookModal = () => {
    const modalProps = {
      title: `New webhook`,
      style: { width: 760 },
      closeOnClickOutside: false,
      body: <Form
        action='createWebhook'
        onSubmit={async (response) => {
          if (!response.error_message) {
            await fetchWebhooks();
            modalRef.close();
          }
        }}
      >
        <Form.Row columnCount={1}>
          <Label text='URL' large></Label>
          <Input name='url' placeholder='URL'></Input>
        </Form.Row>
        <Form.Actions>
          <Button>Create</Button>
        </Form.Actions>
      </Form>,
    };
    const modalRef = modal(modalProps);
  }

  return <Block name='webhook'>
    <Elem name='controls'>
      <Button icon={<LsPlus />} primary onClick={showNewWebhookModal}>
        Add Webhook
      </Button>
    </Elem>
    <Elem name='content'>
      <Block name='webhook-list'>
        {
          webhooks.map(
            (obj) => <Elem name='item' onClick={() => onSelectActive(obj.id)}>
              <Elem tag='span' name='item-status' mod={{ active: obj.is_active }}>
              </Elem>
              <Elem name='item-url'>
                {obj.url}
              </Elem>
              <Elem name='item-type'>
                {obj.send_for_all}
              </Elem>
            </Elem>
          )
        }
      </Block>
    </Elem>
  </Block>
}

const WebhookDetail = ({ webhook, webhooksInfo, fetchWebhooks, onBack }) => {

  const [headers, setHeaders] = useState(null);
  const [sendForAllActions, setSendForAllActions] = useState(null);
  const [actions, setActions] = useState(null);

  const onAddHeaderClick = () => {
    if (!(headers.find(([k, v]) => k === ''))) {
      setHeaders([...headers, ['', '']])
    }
  }
  const onHeaderRemove = (index) => {
    let newHeaders = cloneDeep(headers);
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  }
  const onHeaderChange = (aim, event, index) => {
    let newHeaders = cloneDeep(headers)
    if (aim === 'key') {
      newHeaders[index][0] = event.target.value;
    }
    if (aim === 'value') {
      newHeaders[index][1] = event.target.value;
    }
    setHeaders(newHeaders);
  }

  const onActionChange = (event) => {
    let newActions = new Set(actions);
    if (event.target.checked) {
      newActions.add(event.target.name)
    } else {
      newActions.delete(event.target.name)
    }
    setActions(newActions);
  }

  useEffect(() => {
    if (webhook === null) {
      setHeaders(null);
      sendForAllActions(null);
      setActions(null);
      return
    }
    setHeaders(Object.entries(webhook.headers));
    setSendForAllActions(webhook.send_for_all_actions);
    setActions(new Set(webhook.actions));
  }, [webhook])

  if (headers === null || sendForAllActions === null) return <></>
  return <Block name='webhook'>
    <Elem name='controls'>
      <Button onClick={onBack}>
        Back
        </Button>
    </Elem>
    <Elem name='content'>
      <Form
        action='updateWebhook'
        autoSave={false}
        params={{ pk: webhook.id }}
        formData={{ ...webhook }}
        prepareData={(data) => {
          return {
            ...data,
            'send_for_all_actions': sendForAllActions,
            'headers': Object.fromEntries(headers), 
            'actions': Array.from(actions),
          }
        }}
        onSubmit={async (response) => {
          if (!response.error_message) {
            await fetchWebhooks();
          }
        }}
      >
        <Form.Row columnCount={1}>
          <Label text='URL' large></Label>
          <Input name="url" placeholder="URL" />
        </Form.Row>
        <Form.Row columnCount={1}>
          <div>
            <Toggle name="is_active" label="Is active" />
          </div>
        </Form.Row>
        <Form.Row columnCount={1}>
          <Label text="Headers" large />
          <div style={{ background: 'rgba(0, 0, 0, 0.06)', padding: '16px 0', borderRadius: '8px' }}>
            <div style={{ paddingLeft: '16px' }}>
              {
                headers.map(([headKey, headValue], index) => {
                  return <Form.Row columnCount={3} >
                    <Input placeholder="header" value={headKey} onChange={(e) => onHeaderChange('key', e, index)} />
                    <Input placeholder="value" value={headValue} onChange={(e) => onHeaderChange('value', e, index)} />
                    <div>
                      <Button type='button' icon={<LsCross />} onClick={() => onHeaderRemove(index)}></Button>
                    </div>
                  </Form.Row>
                })
              }
              <Button type='button' style={{ margin: '12px 0 0 0' }} onClick={onAddHeaderClick}>Add Header</Button>
            </div>
          </div>
        </Form.Row>
        <Form.Row columnCount={1}>

          <Label text="Payload" large />
          <div>
            <Toggle name="send_payload" label="Send payload"></Toggle>
          </div>

          <div>
            <Toggle checked={sendForAllActions} label="Send for all actions" onChange={(e) => { setSendForAllActions(e.target.checked); }} />
          </div>
        </Form.Row>
        {
          !sendForAllActions ?
            <Form.Row columnCount={1} >
              <Label text="Actions" large />
              <div columnCount={1} style={{ background: 'rgba(0, 0, 0, 0.06)', padding: '8px 16px', borderRadius: '8px' }}>
                {Object.entries(webhooksInfo).map(([key, value]) => {
                  return <Form.Row>
                    <div>
                      <Toggle skip name={key} type='checkbox' label={value.name} onChange={onActionChange} checked={actions.has(key)}></Toggle>
                    </div>
                  </Form.Row>
                })}
              </div>
            </Form.Row>
            :
            null
        }
        <Form.Actions>
          <Button>Save</Button>
        </Form.Actions>
      </Form>
    </Elem>
  </Block >
}

const Webhook = () => {
  const [activeWebhook, setActiveWebhook] = useState(null);
  const [webhooks, setWebhooks] = useState(null);
  const [webhooksInfo, setWebhooksInfo] = useState(null);
  const api = useAPI();
  const fetchWebhooks = useCallback(async () => {
    const webhooks = await api.callApi('webhooks');
    if (webhooks) setWebhooks(webhooks);
  }, [api]);

  const fetchWebhooksInfo = useCallback(async () => {
    const info = await api.callApi('webhooksInfo');
    if (info) setWebhooksInfo(info);
  }, [api]);

  useEffect(() => {
    fetchWebhooks();
    fetchWebhooksInfo();
  }, []);

  if (webhooks === null || webhooksInfo === null) {
    return null;
  }
  if (activeWebhook === null) {
    return <WebhookList
      onSelectActive={setActiveWebhook}
      webhooks={webhooks} fetchWebhooks={fetchWebhooks} />
  } else {
    return <WebhookDetail
      onBack={() => setActiveWebhook(null)} webhook={webhooks[webhooks.findIndex((x) => x.id === activeWebhook)]}
      fetchWebhooks={fetchWebhooks}
      webhooksInfo={webhooksInfo} />
  }
}
// send_payload
// send_for_all_actions
// headers
// is_active


export const WebhookPage = {
  title: "Webhooks",
  path: "/webhooks",
  component: Webhook,
}