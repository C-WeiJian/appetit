#!/usr/bin/python
#+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#|R|a|s|p|b|e|r|r|y|P|i|-|S|p|y|.|c|o|.|u|k|
#+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#
# ultrasonic_1.py
# Measure distance using an ultrasonic module
#
# Ultrasonic related posts:
# http://www.raspberrypi-spy.co.uk/tag/ultrasonic/
#
# Author : Matt Hawkins
# Date   : 16/10/2016
# -----------------------

# Import required Python libraries
from __future__ import print_function
import time
import RPi.GPIO as GPIO
import httplib
import json

# Use BCM GPIO references
# instead of physical pin numbers
GPIO.setmode(GPIO.BCM)

# Define GPIO to use on Pi
GPIO_TRIGGER = 17
GPIO_ECHO    = 4
GPIO_LED     = 27
GPIO_SWITCH1     = 22
GPIO_SWITCH2     = 23

# Speed of sound in cm/s at temperature
temperature = 20
speedSound = 33100 + (0.6*temperature)

print("Ultrasonic Measurement")
print("Speed of sound is",speedSound/100,"m/s at ",temperature,"deg")

# Set pins as output and input
GPIO.setup(GPIO_TRIGGER,GPIO.OUT)  # Trigger
GPIO.setup(GPIO_ECHO,GPIO.IN)      # Echo
GPIO.setup(GPIO_LED,GPIO.OUT)      # LED
GPIO.setup(GPIO_SWITCH1,GPIO.IN)      # SWITCH1
GPIO.setup(GPIO_SWITCH2,GPIO.IN)      # SWITCH2

default_height = 0
state=0

headers = { "Content-type": "application/json"}

try: 
	conn = httplib.HTTPConnection('appetit.azurewebsites.net')

except:
	print('Cannot connect.')

while 1:

	# Set trigger to False (Low)
	GPIO.output(GPIO_TRIGGER, False)

	# Allow module to settle
	time.sleep(0.5)

	# Send 10us pulse to trigger
	GPIO.output(GPIO_TRIGGER, True)
	# Wait 10us
	time.sleep(0.00001)
	GPIO.output(GPIO_TRIGGER, False)
	start = time.time()

	while GPIO.input(GPIO_ECHO)==0:
	  start = time.time()

	while GPIO.input(GPIO_ECHO)==1:
	  stop = time.time()

	# Calculate pulse length
	elapsed = stop-start

	# Distance pulse travelled in that time is time
	# multiplied by the speed of sound (cm/s)
	distance = elapsed * speedSound

	# That was the distance there and back so halve the value
	distance = distance / 2
	
	print(GPIO.input(GPIO_PIR))
	
	if(default_height==0):
		default_height=distance
	
	
	if((default_height-distance > 2) and state==0):
		print('Weight added. Registering weight:')
		print("Mass of food wastage : {0:5.1f}".format((default_height-distance)*50))
		GPIO.output(GPIO_LED,1)
		
		packet=	{'id': 1,'mass': float("{0:.2f}".format((default_height-distance)*50))}
		packet=json.dumps(packet)
		conn.request('PUT', '/belt', packet, headers=headers)
		response = conn.getresponse()
		print(response.read())
		
		time.sleep(2)
		state=1
		
	elif((default_height-distance > 2) and state==1):{}
		
	else:
		print('No weight registered.')
		GPIO.output(GPIO_LED,0)
		state=0

	# Reset GPIO settings
	
GPIO.cleanup()
